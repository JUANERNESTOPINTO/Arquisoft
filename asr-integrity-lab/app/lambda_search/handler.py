import os, json, boto3
from app.common.integrity import compute_hmac, validate_query

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])
sns = boto3.client('sns')
ALERTS_TOPIC_ARN = os.environ.get('ALERTS_TOPIC_ARN', '')

def _log(metric, value=1, **kwargs):
  print(json.dumps({"metric": metric, "value": value, **kwargs}))

def handler(event, context):
  # HTTP API v2.0
  params = event.get('queryStringParameters') or {}
  q = (params.get('q') or '').strip()

  if not validate_query(q):
    _log("InputTamperingDetected", q=q)
    if ALERTS_TOPIC_ARN:
      sns.publish(TopicArn=ALERTS_TOPIC_ARN,
                  Subject="Input tampering detected",
                  Message=f"Query blocked: {q}")
    return {
      "statusCode": 400,
      "headers": {"Content-Type": "application/json"},
      "body": json.dumps({"error": "Invalid query"})
    }

  # Demo: scan y filtro por prefijo
  resp = table.scan()
  items = resp.get('Items', [])
  filtered = [it for it in items if str(it.get('order_id','')).startswith(q)]

  verified = []
  mismatches = 0
  for it in filtered:
    mac = it.get('integrity', '')
    recomputed = compute_hmac(it)
    if mac != recomputed:
      mismatches += 1
      if ALERTS_TOPIC_ARN:
        sns.publish(TopicArn=ALERTS_TOPIC_ARN,
                    Subject="Integrity mismatch",
                    Message=f"Order {it.get('order_id')} integrity mismatch")
      _log("IntegrityMismatch", order_id=it.get('order_id'))
    else:
      verified.append(it)

  _log("SearchesVerified", count=1, returned=len(verified), mismatches=mismatches)

  return {
    "statusCode": 200,
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps({"results": verified, "mismatches": mismatches})
  }
