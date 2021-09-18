node {
    checkout scm


    docker.withRegistry('https://436994747461.dkr.ecr.us-east-1.amazonaws.com', 'ecr:us-east-1:zb-network') {
      withCredentials([[
        $class: 'AmazonWebServicesCredentialsBinding',
        accessKeyVariable: 'AWS_ACCESS_KEY_ID',
        credentialsId: 'zb-network',
        secretKeyVariable: 'AWS_SECRET_ACCESS_KEY'
      ]]) {

         sh "AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws/b1q3c8q0"
         sh 'docker buildx create --use'
//          sh "docker buildx build --platform linux/arm64 --push --build-arg AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' --build-arg AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' --build-arg CORES=4 --build-arg NODE_OPTIONS=--max_old_space_size=78643 -t public.ecr.aws/b1q3c8q0/getfavicon:\$(bash get-version.sh) ./"
         sh "docker buildx build --platform linux/arm64 --push --build-arg AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' --build-arg AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' --build-arg CORES=4 --build-arg NODE_OPTIONS=--max_old_space_size=78643 -t public.ecr.aws/b1q3c8q0/getfavicon:latest ./"

         sh "AWS_ACCESS_KEY_ID='${AWS_ACCESS_KEY_ID}' AWS_SECRET_ACCESS_KEY='${AWS_SECRET_ACCESS_KEY}' aws ecs update-service --cluster shop-svc --service getfavicon --force-new-deployment --region us-east-1"
      }
    }

    docker.withRegistry('https://docker.io', 'zb-npm') {

    }

     sh 'docker rmi -f $(docker images | grep "getfavicon") || true'
}
