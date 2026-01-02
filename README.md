# Versioned Nginx Deployments

Copies the files from the dist folder over to the remote server defined using env vars. Creates a folder there for rollbacks. 

## Versioning

Moves the dist files into a folder according to this format on the remote server: `/var/www/${project_name}/releases/${date_time}/`.

Creates a symlink to the latest deployment in the folder `/var/www/current`.