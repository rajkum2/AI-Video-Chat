<?php
$success = '';
$divErrors = '';

function postInput($data)
{
    if (!isset($data)) {
        return '';
    }
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function checkPost($value)
{
    return (isset($_POST[$value])) ? $_POST[$value] : null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $serverFolder = realpath(dirname(dirname(__FILE__)));
    $videoApi = postInput($_POST['videoApi']);
    $audioApi = postInput($_POST['audioApi']);
    $chatGptApi = postInput($_POST['chatgpt']);
    $filenameCert = $_POST['filenameCert'];
    $filenameKey = $_POST['filenameKey'];
    $servername = 'localhost';
    $database = postInput($_POST['database']);
    $username = postInput($_POST['username']);
    $password = postInput($_POST['password']);
    $timezone = postInput($_POST['timezone']);
    $charset = 'utf8mb4';
    $dbPrefix = '';
    $errors = array();

    if (!is_dir($serverFolder) && !is_dir($serverFolder . '/config')) {
        array_push($errors, 'Server folder is not correct. Make sure the folder exists and your Server files are there.<br/>');
    }

    $compare = "https://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";
    $explodeUrl = explode('/install', $compare);

    $serverURL = $explodeUrl[0];

    $dsn = "mysql:host=$servername;dbname=$database;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    try {
        $pdo = new PDO($dsn, $username, $password, $options);
    } catch (\PDOException $e) {
        if ($e->getCode() == 1045) {
            array_push($errors, 'Provided MySQL credentials are not proper.<br/>');
        } else if ($e->getCode() == 1049) {
            array_push($errors, 'Provided MySQL database is not existing.<br/>');
        } else if ($e->getCode() == 2002) {
            array_push($errors, 'Cannot connect to the host. Make sure your DB can access remote connections.<br/>');
        } else {
            array_push($errors, $e->getMessage() . '<br/>');
        }
    }

    if (count($errors) > 0) {
        foreach ($errors as $error) {
            $divErrors .= $error;
        }
    } else {

        $sql = file_get_contents('../server/dump_1.0.1.sql');
        $sql .= file_get_contents('../server/dump_1.0.5.sql');
        $sql .= file_get_contents('../server/dump_1.0.7.sql');
        $sql .= file_get_contents('../server/dump_1.0.9.sql');
        $sql .= file_get_contents('../server/dump_1.0.10.sql');
        $pdo->exec($sql);
$phpContent = file_get_contents($installFolderPath . '/src/config.js');
        $str = str_replace("/SSL_CERT_PATH", $filenameCert, $phpContent);
        $str = str_replace("/SSL_KEY_PATH", $filenameKey, $str);
        if ($chatGptApi) {
            $str = str_replace("CHAT_GPT_KEY", $chatGptApi, $str);
            $str = str_replace("enabled: false", "enabled: true", $str);
        }
        if ($videoApi) {
            $str = str_replace("VIDEO_AVATAR_KEY", $videoApi, $str);
            $str = str_replace("VIDEO_AVATAR_STREAM_KEY", $videoApi, $str);
            $str = str_replace("enabled: false", "enabled: true", $str);
        }
        if ($audioApi) {
            $str = str_replace("ELEVENLABS_KEY", $audioApi, $str);
            $str = str_replace("enabled: false", "enabled: true", $str);
        }
        copy('script_ubuntu.sh', $installFolderPath.'/script_ubuntu.sh');

        //server/connect.php file
        $phpContent = file_get_contents($serverFolder . '/server/connect.php');
        $str = str_replace('$database = \'\';', '$database = \'' . $database . '\';', $phpContent);
        $str = str_replace('$username = \'\';', '$username = \'' . $username . '\';', $str);
        $str = str_replace('$password = \'\';', '$password = \'' . $password . '\';', $str);
        $str = str_replace('$timezone = \'\';', '$timezone = \'' . $timezone . '\';', $str);
        if (file_put_contents($serverFolder . '/server/connect.php', $str) == false) {
            array_push($errors, 'Error writing to connect.php file. Make sure files in Server folder are not with root ownershi.<br/>');
        }

        if (count($errors) == 0) {
            $success .= 'Database setup successfully finished!<br/>';
        }

        if (count($errors) == 0) {
            $success .= 'Configuration file successfully generated!<br/>';
        }

        if (count($errors) == 0) {
            $success .= 'You need to login to your terminal/console go to this folder ' . $serverFolder . '/livesmartai/config.js and run <code>sudo bash script.sh</code>.';
            rename ($serverFolder . '/install', $serverFolder . '/' . uniqid());
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <title>Installation wizard</title>
        <link rel="stylesheet" href="../css/bootstrap.min.css">
        <link rel="stylesheet" href="../css/install.css">
    </head>
    <body>
        <div class="bs-example">
            <p>
                Welcome to installation wizard of LiveSmart AI Video! In order to proceed with the installation you need:
                - OpenAI API key;<br/>
                - HeyGen API key;<br/>
                - Node.js at least version 16;<br/>
                - PHP and MySQL database;<br/>
                When you click on Setup button, the database will be set and config file will be generated.
            </p>
            <hr>
            <?php if ($success) { ?>
                <div id="success" class="alert alert-success col-sm-10">
                    <?php echo $success; ?>
                </div>
            <?php } ?>
            <?php if ($divErrors) { ?>
                <div id="errors" class="alert alert-danger col-sm-10">
                    <?php echo $divErrors; ?>
                </div>
            <?php } ?>
            <form method="post">
                <div class="form-group row">
                    <label for="filenameCert" class="col-sm-3 col-form-label">Certificate path</label>

                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="filenameCert" id="filenameCert" value="<?php echo @$_POST['filenameCert'] ?>" placeholder="Certificate absolute path" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="filenameKey" class="col-sm-3 col-form-label">Key path</label>

                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="filenameKey" id="filenameKey" value="<?php echo @$_POST['filenameKey'] ?>" placeholder="Key absolute path" required>
                    </div>
                </div>
                <div class="form-group row">
                    <small>Absolute paths where your certificate and key are. <br/>
                        Contact your host support if you do not know these locations.
                    </small>
                </div>
                <div class="form-group row">
                    <label for="database" class="col-sm-3 col-form-label">Database</label>
                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="database" id="database" placeholder="Database name" value="<?php echo checkPost('database'); ?>" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="username" class="col-sm-3 col-form-label">Database Username</label>
                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="username" id="username" placeholder="Database username" value="<?php checkPost('username'); ?>" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="password" class="col-sm-3 col-form-label">Database Password</label>
                    <div class="col-sm-8">
                        <input type="password" class="form-control" name="password" id="password" placeholder="Database password" required>
                    </div>
                </div>
                <div class="form-group row">
                    <small>You need to provide here your database information, where you need your instance to be installed.
                    </small>
                </div>
                <hr>
                <div class="form-group row">
                    <label for="apisecret" class="col-sm-3 col-form-label">HeyGen Video Avatar API Key</label>
                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="videoApi" id="videoApi" placeholder="HeyGen API Key" value="<?php echo checkPost('videoApi') ?>">
                    </div>
                </div>
                <div class="form-group row">
                    <small>Steps to get the key: 1. Go to <a href="https://heygen.com/?sid=rewardful&via=nikolay" target="_blank">https://heygen.com/</a>; 2. Create your account; 3. Go to <a href="https://app.heygen.com/settings?nav=API" target="_blank">API</a>;
                    </small>
                </div>
                <hr>
                <div class="form-group row">
                    <label for="apisecret" class="col-sm-3 col-form-label">ChatGPT API Key</label>
                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="chatgpt" id="chatgpt" placeholder="ChatGPT API Key" value="<?php echo checkPost('chatgpt'); ?>">
                    </div>
                </div>
                <div class="form-group row">
                    <small>Steps to get the key: 1. Go to <a href="https://platform.openai.com/" target="_blank">https://platform.openai.com/</a>; 2. Create your account; 3. Generate your <a href="https://platform.openai.com/account/api-keys" target="_blank">APIKey</a>;
                    </small>
                </div>
                <hr>
                <div class="form-group row">
                    <label for="apisecret" class="col-sm-3 col-form-label">ElevenLabs API Key (for audio only avatar)</label>
                    <div class="col-sm-8">
                        <input type="input" class="form-control" name="audioApi" id="audioApi" placeholder="ElevenLabs API Key" value="<?php echo checkPost('audioApi') ?>">
                    </div>
                </div>
                <div class="form-group row">
                    <small>Steps to get the key: 1. Go to <a href="https://try.elevenlabs.io/n3s0gi58vq7u" target="_blank">https://elevenlabs.io/</a>; 2. Create your account; 3. Go to <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank">API</a>; 4. Create an API;
                    </small>
                </div>
                <hr>
                <div class="form-group row">
                    <div class="col-sm-10 offset-sm-2">
                        <input type="hidden" name="timezone" id="timezone">
                        <button type="submit" class="btn btn-primary">Setup</button>
                    </div>
                </div>
            </form>
        </div>
    </body>
</html>
