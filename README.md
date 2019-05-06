# FastSite

### :rocket: Deploy your static websites in minutes! :rocket:

Combining the usage of several AWS tools, your website is up & blazing fast in minutes!

## Usage

### 1. Installation
Install fastsite using your package manager.

For npm users
```bash
npm install -g fastsite
```
For yarn users
```bash
yarn global add fastsite
```
### 2. Set up AWS credentials
Using either

* 1\. The AWS CLI (installation guide [here](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)). The configurator will ask for everything you need
    ```bash
    aws configure
    ```
* 2\. The AWS Credentials file.
        
        ~/.aws/credentials on Linux, macOS, or Unix

        C:\Users\USERNAME\.aws\credentials on Windows
    
        Ensure it has the following content
        ```
        [default]
        aws_access_key_id = your_access_key_id
        aws_secret_access_key = your_secret_access_key
        ```

* 3\. Environment variables
    
    For Linux, maxOS or unix
    ```
    export AWS_ACCESS_KEY_ID=your_access_key_id
    export AWS_SECRET_ACCESS_KEY=your_secret_access_key
    ```

    For Windows
    ```
    set AWS_ACCESS_KEY_ID=your_access_key_id
    set AWS_SECRET_ACCESS_KEY=your_secret_access_key
    ```

### 3. Deploy your website

In a terminal, do the following to create a new deployment or update an existing
```bash
fastsite deploy --name [PROJECT_NAME] --path [PATH_TO_STATIC_FILES]
```
(to see more options use `fastsite deploy --help`)

***NOTE*** 
The first deployment takes about 15 minutes for AWS to get everything ready, don't worry!

### 4. Remove an existing deployment
In a terminal, do the following to remove an existing deployment
```bash
fastsite remove --name [PROJECT_NAME]
```
(to see more options use `fastsite remove --help`)

***NOTE*** 
The deployment is not completely removed after the command is done, but it will be in about 20 minutes.


## Author
Melker Veltman

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.