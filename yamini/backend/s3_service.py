import boto3
import os
from uuid import uuid4

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

BUCKET = os.getenv("AWS_S3_BUCKET")


def upload_file(file, folder="uploads"):
    """Upload a file to S3 and return the public URL."""
    ext = file.filename.split(".")[-1]
    key = f"{folder}/{uuid4()}.{ext}"

    s3.upload_fileobj(
        file.file,
        BUCKET,
        key,
        ExtraArgs={"ContentType": file.content_type}
    )

    return f"https://{BUCKET}.s3.amazonaws.com/{key}"


def upload_bytes(data: bytes, filename: str, content_type: str = "image/jpeg", folder: str = "uploads"):
    """Upload raw bytes to S3 and return the public URL."""
    ext = filename.split(".")[-1] if "." in filename else "jpg"
    key = f"{folder}/{uuid4()}.{ext}"

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=data,
        ContentType=content_type,
    )

    return f"https://{BUCKET}.s3.amazonaws.com/{key}"
