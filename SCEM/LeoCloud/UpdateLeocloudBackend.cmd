set NameSpace=student-h-aitenbichler
set AppPrefix=demosypapi

kubectl delete -n %NameSpace% deployment %AppPrefix%
kubectl delete -n %NameSpace% service %AppPrefix%-svc
kubectl delete -n %NameSpace% ingress %AppPrefix%-ingress
kubectl delete -n %NameSpace% pod -l app=%AppPrefix%
kubectl create -f ./backend-leocloud-%NameSpace%-%AppPrefix%-volumnsClaim.yaml
kubectl create -f ./backend-leocloud-%NameSpace%-%AppPrefix%.yaml

pause

:: Copy from volumn => kubectl cp student-h-aitenbichler/demosypapi-79686ccb6c-8r87r:/app/Data .