# Versioned Nginx Deployments

Copies the files from the dist folder over to the remote server. Creates folders for rollbacks using timestamps.

## Commands

`ship`

Moves the dist files into a folder according to this format on the remote server: `/var/www/${project_name}/releases/${date_time}/`.

Creates a symlink to the latest deployment in the folder `/var/www/current` so the content can be viewed.

`pull`

Retrieves the latest deployment so it can be edited and later on deployed as a new version.
