import hmac
import hashlib
import base64

def verify_hunar_webhook_signature(
    signature_header: str | None,
    timestamp_header: str | None,
    request_body: bytes,
    trusted_api_keys: list[str],
) -> bool:
    if not signature_header or not timestamp_header:
        return False
    
    signed_message = f"{timestamp_header}.".encode("utf-8") + request_body
    
    for api_key in trusted_api_keys:
        secret = api_key.encode("utf-8")
        expected_mac = hmac.new(key=secret, msg=signed_message, digestmod=hashlib.sha256).digest()
        expected_signature = base64.b64encode(expected_mac).decode("utf-8")
        if hmac.compare_digest(expected_signature, signature_header):
            return True
            
    return False
