# WEBSITES
home of personal websites


## Sites
llaurens.com
```
sudo deploy ./llaurens.com llaurens.com/htdocs
```

tommmi.com
Deploy command 
```
sudo deploy ./tommmi.com tommmi.com/htdocs
```

## Tools
deploy

Usage: ```/usr/local/bin/deploy <source_path> <relative_dest_path> [backup_directory]```

This script deploys HTML files from the specified source path
to the destination directory for Nginx.

Arguments:
  <source_path>         The path to the HTML file or directory to be deployed.
  <relative_dest_path>  The relative path under the base destination directory.
  [backup_directory]    Optional. The directory where the backup will be stored.

Examples:
```
  sudo /usr/local/bin/deploy ./wwwdev amd1.mooo.com
  sudo /usr/local/bin/deploy ./wwwdev/index.html amd1.mooo.com
  sudo /usr/local/bin/deploy ./wwwdev amd1.mooo.com /home/ubuntu/backup

```
