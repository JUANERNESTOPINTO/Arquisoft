#
# Terraform — Infraestructura ASR Integridad
#
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.55"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = var.region
}

# Secret con la llave de HMAC
resource "aws_secretsmanager_secret" "integrity_secret" {
  name        = "asr-integrity/INTEGRITY_SECRET"
  description = "Secret for HMAC integrity checks"
}

resource "aws_secretsmanager_secret_version" "integrity_secret_value" {
  secret_id     = aws_secretsmanager_secret.integrity_secret.id
  secret_string = var.integrity_secret_value
}

# DynamoDB Orders table
resource "aws_dynamodb_table" "orders" {
  name         = "Orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "order_id"

  attribute {
    name = "order_id"
    type = "S"
  }
}

# SNS for alerts
resource "aws_sns_topic" "alerts" {
  name = "IntegrityAlerts"
}

# IAM role/policy para Lambda Search
resource "aws_iam_role" "lambda_exec" {
  name               = "asr-integrity-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "secretsmanager:GetSecretValue"
    ]
    resources = [aws_secretsmanager_secret.integrity_secret.arn]
  }

  statement {
    actions = [
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:GetItem"
    ]
    resources = [aws_dynamodb_table.orders.arn]
  }

  statement {
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }

  statement {
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  name   = "asr-integrity-lambda-policy"
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# Empaquetado de lambdas (zip)
data "archive_file" "lambda_search_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../app"
  output_path = "${path.module}/../lambda_bundle.zip"
}

# Lambda SEARCH (handler en app/lambda_search/handler.py)
resource "aws_lambda_function" "search" {
  function_name = "asr-integrity-search"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_search.handler"
  runtime       = "python3.11"

  filename         = data.archive_file.lambda_search_zip.output_path
  source_code_hash = data.archive_file.lambda_search_zip.output_base64sha256

  environment {
    variables = {
      ORDERS_TABLE     = aws_dynamodb_table.orders.name
      SECRET_ARN       = aws_secretsmanager_secret.integrity_secret.arn
      ALERTS_TOPIC_ARN = aws_sns_topic.alerts.arn
    }
  }
}

# Lambda SEED (mismo zip, handler distinto)
resource "aws_lambda_function" "seed" {
  function_name = "asr-integrity-seed"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "lambda_seed.handler"
  runtime       = "python3.11"

  filename         = data.archive_file.lambda_search_zip.output_path
  source_code_hash = data.archive_file.lambda_search_zip.output_base64sha256

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
      SECRET_ARN   = aws_secretsmanager_secret.integrity_secret.arn
    }
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "http" {
  name          = "asr-integrity-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_search" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.search.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "search_route" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /search"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_search.id}"
}

resource "aws_lambda_permission" "api_allow_search" {
  statement_id  = "AllowAPIGatewayInvokeSearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

# WAF (Web ACL) con reglas administradas + regex custom
resource "aws_wafv2_web_acl" "api_waf" {
  name        = "asr-integrity-waf"
  scope       = "REGIONAL"
  description = "Protect /search against tampering"
  default_action { allow {} }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "asr-integrity-waf"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 1
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action { none {} }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CRS"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action { none {} }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BadInputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 3
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    override_action { none {} }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLi"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "Custom-Search-Regex"
    priority = 10
    statement {
      regex_match_statement {
        field_to_match { query_string {} }
        regex_string = "^[A-Za-z0-9\\-\\s]{1,64}$"
        text_transformations {
          priority = 0
          type     = "NONE"
        }
      }
    }
    action { allow {} }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SearchRegex"
      sampled_requests_enabled   = true
    }
  }
}

# Asociación WAF → API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_assoc" {
  resource_arn = aws_apigatewayv2_stage.default.arn
  web_acl_arn  = aws_wafv2_web_acl.api_waf.arn
}

output "api_url" {
  value = aws_apigatewayv2_api.http.api_endpoint
}
