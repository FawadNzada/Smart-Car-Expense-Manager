set NameSpace=student-h-aitenbichler
set AppPrefix=demosypui

kubectl delete -n %NameSpace% deployment %AppPrefix%
kubectl delete -n %NameSpace% service %AppPrefix%-svc
kubectl delete -n %NameSpace% ingress %AppPrefix%-ingress
kubectl delete -n %NameSpace% pod -l app=%AppPrefix%
kubectl create -f ./frontend-leocloud-%NameSpace%-%AppPrefix%.yaml

pause