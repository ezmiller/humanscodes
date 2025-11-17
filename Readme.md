HumansCode
==========

A simple static website built with jekyll for blogging about programming and the digital humanities.

[http://humanscode.com](http://humanscode.com)

## Deployment

CI/CD is handled by GitHub Actions and deploys the built site to AWS S3 with a CloudFront cache invalidation.
- Workflow: `.github/workflows/build_and_deploy.yml` (runs on push to `master` or manually via `workflow_dispatch`).
- S3 target: `s3://${{ secrets.AWS_S3_BUCKET_NAME }}` in region `us-west-2`.
- Required repository secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_CLOUDFRONT_DISTRIBUTION_ID`.

