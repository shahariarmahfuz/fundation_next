import os
import re
import logging
from typing import Optional, Dict, Any, List, Tuple
from fastapi import UploadFile, HTTPException, status
import cloudinary
import cloudinary.uploader
import cloudinary.api

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


# Maximum file sizes in bytes
MAX_SIZES = {
    "PHOTO": 5 * 1024 * 1024,        # 5 MB
    "SIGNATURE": 2 * 1024 * 1024,    # 2 MB
    "NID_FRONT": 10 * 1024 * 1024,   # 10 MB
    "NID_BACK": 10 * 1024 * 1024,    # 10 MB
    "BIRTH_CERTIFICATE": 10 * 1024 * 1024,  # 10 MB
    "DOCUMENT": 10 * 1024 * 1024,    # 10 MB
    "OTHER": 10 * 1024 * 1024        # 10 MB
}

# Allowed MIME types and extensions
ALLOWED_IMAGE_MIMES = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"]
}

ALLOWED_DOCUMENT_MIMES = {
    **ALLOWED_IMAGE_MIMES,
    "application/pdf": [".pdf"]
}


class CloudinaryService:
    _configured: bool = False

    @classmethod
    def configure(cls) -> None:
        """Initialize Cloudinary client with environment variables."""
        if cls._configured:
            return

        cloud_name = settings.CLOUDINARY_CLOUD_NAME
        api_key = settings.CLOUDINARY_API_KEY
        api_secret = settings.CLOUDINARY_API_SECRET

        if cloud_name and api_key and api_secret:
            cloudinary.config(
                cloud_name=cloud_name,
                api_key=api_key,
                api_secret=api_secret,
                secure=True
            )
            cls._configured = True
        elif settings.CLOUDINARY_URL:
            os.environ["CLOUDINARY_URL"] = settings.CLOUDINARY_URL
            cloudinary.reset_config()
            cls._configured = True
        else:
            logger.warning("Cloudinary credentials are not fully configured in environment variables.")

    @classmethod
    def is_configured(cls) -> bool:
        cls.configure()
        return cls._configured

    @classmethod
    def validate_file(
        cls,
        file: UploadFile,
        category: str = "PHOTO"
    ) -> Tuple[bytes, str, str]:
        """
        Validates file content-type, extension, and file size.
        Returns (file_bytes, clean_filename, mime_type).
        """
        category_upper = category.upper()
        max_size = MAX_SIZES.get(category_upper, 5 * 1024 * 1024)

        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename cannot be empty."
            )

        # Sanitize filename
        clean_filename = os.path.basename(file.filename)
        _, ext = os.path.splitext(clean_filename.lower())

        content_type = file.content_type or ""

        # Validate MIME and extension based on category
        if category_upper in ("PHOTO", "SIGNATURE"):
            valid_mimes = ALLOWED_IMAGE_MIMES
            type_label = "Image (JPEG, PNG, WEBP)"
        else:
            valid_mimes = ALLOWED_DOCUMENT_MIMES
            type_label = "Document or Image (PDF, JPEG, PNG, WEBP)"

        if content_type not in valid_mimes:
            # Fallback check on extension if browser sent generic application/octet-stream
            matching_mime = None
            for mime, exts in valid_mimes.items():
                if ext in exts:
                    matching_mime = mime
                    break
            if not matching_mime:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid file type '{content_type}'. Allowed types for {category}: {type_label}."
                )
            content_type = matching_mime
        else:
            # Check extension matches allowed
            if ext not in valid_mimes[content_type]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File extension '{ext}' does not match content type '{content_type}'."
                )

        # Read and check size
        file_bytes = file.file.read()
        file_size = len(file_bytes)

        if file_size == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty (0 bytes)."
            )

        if file_size > max_size:
            max_mb = max_size / (1024 * 1024)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum limit of {max_mb:.1f} MB for {category}."
            )

        # Reset pointer for any subsequent reads
        file.file.seek(0)

        return file_bytes, clean_filename, content_type

    @classmethod
    def upload(
        cls,
        file_bytes: bytes,
        filename: str,
        folder: str,
        resource_type: str = "auto",
        public_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads binary file to Cloudinary with secure settings.
        Returns normalized asset dictionary.
        """
        cls.configure()
        if not cls._configured:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Cloudinary is not configured on the server. Please check backend environment variables."
            )

        upload_options: Dict[str, Any] = {
            "folder": folder,
            "resource_type": resource_type,
            "use_filename": False,
            "unique_filename": True,
            "overwrite": True,
            "invalidate": True
        }

        if public_id:
            upload_options["public_id"] = public_id

        try:
            res = cloudinary.uploader.upload(file_bytes, **upload_options)
            return {
                "public_id": res.get("public_id"),
                "secure_url": res.get("secure_url"),
                "resource_type": res.get("resource_type", "image"),
                "format": res.get("format"),
                "bytes": res.get("bytes", len(file_bytes)),
                "width": res.get("width"),
                "height": res.get("height"),
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to upload media to Cloudinary: {str(e)}"
            )

    @classmethod
    def delete(
        cls,
        public_id: str,
        resource_type: str = "image"
    ) -> bool:
        """
        Deletes asset from Cloudinary.
        """
        cls.configure()
        if not cls._configured or not public_id:
            return False

        try:
            res = cloudinary.uploader.destroy(public_id, resource_type=resource_type, invalidate=True)
            result = res.get("result")
            if result in ("ok", "not found"):
                return True
            logger.warning(f"Cloudinary destroy returned: {res}")
            return False
        except Exception as e:
            logger.error(f"Cloudinary deletion failed for {public_id}: {str(e)}")
            return False

    @classmethod
    def replace(
        cls,
        old_public_id: Optional[str],
        file_bytes: bytes,
        filename: str,
        folder: str,
        resource_type: str = "auto",
        old_resource_type: str = "image"
    ) -> Dict[str, Any]:
        """
        Safely replaces an existing Cloudinary asset:
        1. Uploads new asset first.
        2. If upload succeeds, deletes old asset.
        """
        # Upload new asset first
        new_asset = cls.upload(
            file_bytes=file_bytes,
            filename=filename,
            folder=folder,
            resource_type=resource_type
        )

        # Only delete old asset if new upload succeeded and old asset exists
        if old_public_id:
            try:
                cls.delete(old_public_id, resource_type=old_resource_type)
            except Exception as e:
                logger.warning(f"Could not delete replaced old asset {old_public_id}: {str(e)}")

        return new_asset

    @classmethod
    def get_url(cls, public_id: str, **options: Any) -> str:
        """Generates secure Cloudinary URL."""
        cls.configure()
        return cloudinary.CloudinaryImage(public_id).build_url(secure=True, **options)
