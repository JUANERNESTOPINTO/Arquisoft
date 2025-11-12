variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "integrity_secret_value" {
  description = "Valor del secreto HMAC (elige una cadena larga y aleatoria)"
  type        = string
  default     = "CHANGE-ME-TO-A-LONG-RANDOM-SECRET"
}
