import os, json, time, random, boto3
from app.common.integrity import compute_hmac

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['ORDERS_TABLE'])

def handler(event, context):
  body = {"inserted": 0}
  now = int(time.time())

  for i in range(1, 21):
    item = {
      "order_id": f"order-{i}",
      "customer_id": f"cust-{(i%5)+1}",
      "status": "CREATED" if i%3 else "PAID",
      "total": round(10 + random.random()*90, 2),
      "ts": now - i*60
    }
    item["integrity"] = compute_hmac(item)
    table.put_item(Item=item)
    body["inserted"] += 1

  return {
    "statusCode": 200,
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps(body)
  }
