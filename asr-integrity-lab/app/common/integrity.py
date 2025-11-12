import hmac, hashlib, os, json, boto3

_secrets_client = boto3.client('secretsmanager')
_SECRET_ARN = os.environ.get("SECRET_ARN")
_SECRET_CACHE = None

def _get_secret():
  global _SECRET_CACHE
  if _SECRET_CACHE is None:
    resp = _secrets_client.get_secret_value(SecretId=_SECRET_ARN)
    _SECRET_CACHE = resp.get("SecretString")
    if not _SECRET_CACHE:
      _SECRET_CACHE = resp.get("SecretBinary")
  return _SECRET_CACHE

def compute_hmac(payload: dict) -> str:
  """
  Calcula HMAC-SHA256 de los campos relevantes del pedido.
  """
  secret = _get_secret()
  # Serialización canónica
  relevant = {
      "order_id": str(payload.get("order_id", "")),
      "customer_id": str(payload.get("customer_id", "")),
      "status": str(payload.get("status", "")),
      "total": str(payload.get("total", "")),
      "ts": str(payload.get("ts", "")),
  }
  msg = json.dumps(relevant, separators=(',', ':'), sort_keys=True).encode("utf-8")
  mac = hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()
  return mac

def validate_query(q: str) -> bool:
  """
  Acepta alfanumérico, espacios y guiones, 1..64 chars.
  """
  if not q:
    return False
  if len(q) > 64:
    return False
  for ch in q:
    if not (ch.isalnum() or ch in [' ', '-']):
      return False
  return True
