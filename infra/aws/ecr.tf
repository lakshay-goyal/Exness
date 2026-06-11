locals {
  # Maps ECR repo suffix -> Dockerfile (the workflow mirrors this mapping).
  services = {
    backend       = "apps/docker/Backend.Dockerfile"
    engine        = "apps/docker/Engine.Dockerfile"
    snap-shotting = "apps/docker/Snap_Shotting.Dockerfile"
    dbstorage     = "apps/docker/DBstorage.Dockerfile"
    web           = "apps/docker/web.Dockerfile"
  }
}

resource "aws_ecr_repository" "service" {
  for_each = local.services

  name                 = "${var.project_name}-${each.key}"
  image_tag_mutability = "MUTABLE" # 'latest' tag is re-pointed on every deploy
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep the bill flat: only the 10 most recent images per repo.
resource "aws_ecr_lifecycle_policy" "service" {
  for_each   = aws_ecr_repository.service
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
