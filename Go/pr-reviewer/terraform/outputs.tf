output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "cloudwatch_log_group" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

output "github_webhook_secret_arn" {
  description = "ARN of the GitHub webhook secret in Secrets Manager"
  value       = aws_secretsmanager_secret.github_webhook_secret.arn
}

output "llm_api_key_secret_arn" {
  description = "ARN of the LLM API key secret in Secrets Manager"
  value       = aws_secretsmanager_secret.llm_api_key.arn
} 