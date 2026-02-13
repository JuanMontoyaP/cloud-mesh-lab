import json
import logging
import cfnresponse
from typing import Dict, Any

import boto3
import mysql.connector

logging.basicConfig(
    format="[%(asctime)s] - %(levelname)s - %(filename)s - %(funcName)s:%(lineno)d - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def get_secret_value(arn: str) -> Dict[str, str]:
    """
    Placeholder function to retrieve secret values from AWS Secrets Manager.

    Args:
        arn: The ARN of the secret to retrieve
    Returns:
        The secret value as a dictionary
    """
    client = boto3.client("secretsmanager", region_name="us-east-1")
    try:
        response = client.get_secret_value(SecretId=arn)
        secret_value = response.get("SecretString", "")
        logger.info("Successfully retrieved secret from Secrets Manager.")
        return json.loads(secret_value)
    except Exception as e:
        logger.error("Error retrieving secret from Secrets Manager: %s", str(e))
        raise


def initialize_database(
    db_host: str,
    db_port: int,
    username: str,
    password: str,
    users_username: str,
    users_pwd: str,
    tasks_username: str,
    tasks_pwd: str,
) -> None:
    """
    Placeholder function to initialize the database with the provided credentials.

    Args:
        db_host: Database host address
        db_port: Database port number
        username: Database username
        password: Database password
        users_username: Users database username
        users_pwd: Users database password
        tasks_username: Tasks database username
        tasks_pwd: Tasks database password
    """
    logger.info(
        "Initializing database at %s:%d with user '%s'.",
        db_host,
        db_port,
        username,
    )
    conn = None
    try:
        conn = mysql.connector.connect(
            host=db_host,
            port=db_port,
            user=username,
            password=password,
            connect_timeout=30,
        )

        with conn.cursor() as cursor:
            logger.info("Executing database initialization script.")
            # Create users_db and user for users service
            cursor.execute(
                "CREATE DATABASE IF NOT EXISTS users_db "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )

            # users user
            cursor.execute("DROP USER IF EXISTS %s@'%'", (users_username,))
            cursor.execute(
                "CREATE USER %s@'%' IDENTIFIED BY %s",
                (users_username, users_pwd),
            )
            cursor.execute(
                "GRANT ALL PRIVILEGES ON users_db.* TO %s@'%'",
                (users_username,),
            )

            # Create tasks_db and user for tasks service
            cursor.execute(
                "CREATE DATABASE IF NOT EXISTS tasks_db "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
            # tasks user
            cursor.execute("DROP USER IF EXISTS %s@'%'", (tasks_username,))
            cursor.execute(
                "CREATE USER %s@'%' IDENTIFIED BY %s",
                (tasks_username, tasks_pwd),
            )
            cursor.execute(
                "GRANT ALL PRIVILEGES ON tasks_db.* TO %s@'%'",
                (tasks_username,),
            )

            cursor.execute("FLUSH PRIVILEGES")

            logger.info("Database initialization completed successfully")

        conn.commit()
    except Exception as e:
        logger.error("Error initializing database: %s", str(e))
        raise
    finally:
        if conn:
            conn.close()


def handler(event: Dict[str, Any], context: Any) -> None:
    """
    Custom Resource handler to initialize Aurora MySQL databases and users.

    Args:
        event: Lambda event object
        context: Lambda context object
    """

    logger.info("Event: %s", json.dumps(event, default=str))

    response_data: Dict[str, str] = {}

    try:
        request_type = event.get("RequestType")

        match request_type:
            case "Delete":
                logger.info(
                    "Delete request received, skipping database initialization."
                )
                cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                return
            case "Create" | "Update":
                logger.info(
                    "Processing %s request for database initialization.", request_type
                )
                props = event.get("ResourceProperties", {})
                db_secret_arn = props.get("DbSecretArn")
                users_pwd_arn = props.get("UsersPasswordArn")
                tasks_pwd_arn = props.get("TasksPasswordArn")

                logger.info("Getting passwords from Secrets Manager.")

                try:
                    db_secret = get_secret_value(db_secret_arn)
                    users_pwd = get_secret_value(users_pwd_arn)
                    tasks_pwd = get_secret_value(tasks_pwd_arn)

                    initialize_database(
                        db_host=db_secret["host"],
                        db_port=int(db_secret["port"]),
                        username=db_secret["username"],
                        password=db_secret["password"],
                        users_username=users_pwd["username"],
                        users_pwd=users_pwd["password"],
                        tasks_username=tasks_pwd["username"],
                        tasks_pwd=tasks_pwd["password"],
                    )
                except Exception as e:
                    logger.error("Error during database initialization: %s", str(e))
                    cfnresponse.send(
                        event,
                        context,
                        cfnresponse.FAILED,
                        response_data,
                        reason=str(e),
                    )
                    return

                cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                return
            case _:
                logger.error("Unsupported request type: %s", request_type)
                cfnresponse.send(
                    event,
                    context,
                    cfnresponse.FAILED,
                    response_data,
                    reason="Unsupported request type",
                )
                return
    except Exception as e:
        logger.error("Error processing event: %s", str(e))
        return cfnresponse.send(
            event, context, cfnresponse.FAILED, response_data, reason=str(e)
        )
