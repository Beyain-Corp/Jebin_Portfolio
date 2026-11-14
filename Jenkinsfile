pipeline {
    agent any

    // Run automatically every 2 minutes
    triggers {
        cron('H/2 * * * *')
    }

    options {
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        // Configure these credentials in Jenkins (Manage Jenkins -> Credentials)
        // 1. Secret text (ID: 'notion-api-key')
        // 2. Secret text (ID: 'notion-database-id')
        NOTION_API_KEY = credentials('notion-api-key')
        NOTION_DATABASE_ID = credentials('notion-database-id')
    }

    stages {
        stage('Checkout') {
            steps {
                // Check out the main branch from GitHub
                checkout scm
            }
        }

        stage('Sync from Notion') {
            steps {
                sh '''
                    echo "[INFO] Node environment check:"
                    node -v || (echo "[ERROR] Node.js 18+ is required on Jenkins agent" && exit 1)
                    
                    echo "[INFO] Running Notion CMS Sync Engine..."
                    node scripts/sync-notion.js
                '''
            }
        }

        stage('Commit & Push to GitHub') {
            steps {
                // Uses Jenkins Credential 'github-pat-jebin' (Username with password: username=GitHub username, password=Personal Access Token)
                withCredentials([usernamePassword(credentialsId: 'github-pat-jebin', usernameVariable: 'GH_USER', passwordVariable: 'GH_TOKEN')]) {
                    sh '''
                        git config user.name "Jenkins Automation [OCI]"
                        git config user.email "jenkins-bot@beyain-corp.com"

                        # Stage Notion content artifacts
                        git add assets/data/articles.json assets/img/notion/ index.html

                        # Check if any changes were staged
                        if ! git diff --staged --quiet; then
                            echo "[INFO] New Notion articles or updates detected. Committing..."
                            git commit -m "chore(cms): auto-sync articles from Notion"
                            
                            echo "[INFO] Pushing to GitHub main branch..."
                            git push https://${GH_USER}:${GH_TOKEN}@github.com/Beyain-Corp/Jebin_Portfolio.git HEAD:main
                            echo "[SUCCESS] Successfully synchronized Notion to GitHub! GitHub Pages will auto-deploy."
                        else
                            echo "[INFO] No Notion changes detected. Repository is up to date."
                        fi
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo "[ALERT] Jenkins Notion sync pipeline failed on OCI instance (129.225.114.209:1010). Check console output."
        }
    }
}

