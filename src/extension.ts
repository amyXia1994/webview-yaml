import * as vscode from 'vscode';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('kusion.showPreview', () => {
			createOrShow(context.extensionUri, false);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('kusion.showPreviewToSide', () => {
			createOrShow(context.extensionUri, true);
		})
	);
}



function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: false,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
	};
}


function createOrShow(extensionUri: vscode.Uri, toSide: boolean) {
	const column = toSide && vscode.window.activeTextEditor
		? vscode.ViewColumn.Beside
		: (vscode.window.activeTextEditor?vscode.window.activeTextEditor.viewColumn:undefined);


	// Otherwise, create a new panel.
	const panel = vscode.window.createWebviewPanel(
		'kusion.yamlPreview',
		'[Preview] data output in yaml format',
		column || vscode.ViewColumn.One,
		getWebviewOptions(extensionUri),
	);
	const html = getHtmlForYamlWebview(`apiVersion: v1
kind: Service
metadata:
	name: redis-master
	labels:
	app: redis
	tier: backend
	role: master
spec:
	ports:
	- port: 6379
	targetPort: 6379
	selector:
	app: redis
	tier: backend
	role: master
---
apiVersion: apps/v1 #  for k8s versions before 1.9.0 use apps/v1beta2  and before 1.8.0 use extensions/v1beta1
kind: Deployment
metadata:
	name: redis-master
spec:
	selector:
	matchLabels:
		app: redis
		role: master
		tier: backend
	replicas: 1
	template:
	metadata:
		labels:
		app: redis
		role: master
		tier: backend
	spec:
		containers:
		- name: master
		image: registry.k8s.io/redis:e2e  # or just image: redis
		resources:
			requests:
			cpu: 100m
			memory: 100Mi
		ports:
		- containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
	name: redis-replica
	labels:
	app: redis
	tier: backend
	role: replica
spec:
	ports:
	- port: 6379
	selector:
	app: redis
	tier: backend
	role: replica
---
apiVersion: apps/v1 #  for k8s versions before 1.9.0 use apps/v1beta2  and before 1.8.0 use extensions/v1beta1
kind: Deployment
metadata:
	name: redis-replica
spec:
	selector:
	matchLabels:
		app: redis
		role: replica
		tier: backend
	replicas: 2
	template:
	metadata:
		labels:
		app: redis
		role: replica
		tier: backend
	spec:
		containers:
		- name: replica
		image: gcr.io/google_samples/gb-redisslave:v1
		resources:
			requests:
			cpu: 100m
			memory: 100Mi
		env:
		- name: GET_HOSTS_FROM
			value: dns
			# If your cluster config does not include a dns service, then to
			# instead access an environment variable to find the master
			# service's host, comment out the 'value: dns' line above, and
			# uncomment the line below:
			# value: env
		ports:
		- containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
	name: frontend
	labels:
	app: guestbook
	tier: frontend
spec:
	# comment or delete the following line if you want to use a LoadBalancer
	type: NodePort
	# if your cluster supports it, uncomment the following to automatically create
	# an external load-balanced IP for the frontend service.
	# type: LoadBalancer
	ports:
	- port: 80
	selector:
	app: guestbook
	tier: frontend
---
apiVersion: apps/v1 #  for k8s versions before 1.9.0 use apps/v1beta2  and before 1.8.0 use extensions/v1beta1
kind: Deployment
metadata:
	name: frontend
spec:
	selector:
	matchLabels:
		app: guestbook
		tier: frontend
	replicas: 3
	template:
	metadata:
		labels:
		app: guestbook
		tier: frontend
	spec:
		containers:
		- name: php-redis
		image: gcr.io/google-samples/gb-frontend:v4
		resources:
			requests:
			cpu: 100m
			memory: 100Mi
		env:
		- name: GET_HOSTS_FROM
			value: dns
			# If your cluster config does not include a dns service, then to
			# instead access environment variables to find service host
			# info, comment out the 'value: dns' line above, and uncomment the
			# line below:
			# value: env
		ports:
		- containerPort: 80`);
	const path = '/Users/amy/Documents/practice/webview-yaml/my-yaml.html';
	saveToHtmlFile(html,path);
	vscode.window.showInformationMessage(`html output to:${path}`);
	panel.webview.html = html;
}

function saveToHtmlFile(htmlContent: string, path: string){
	fs.writeFile(path, htmlContent, {}, ()=>{console.log("done");});
}

function getHtmlForYamlWebview(yamlData: string) {
		return `
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/dark.min.css">
		</head>
<body>
	<pre>
		<code class="language-yaml">${yamlData}</code>
        </pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
    <script>
        hljs.highlightAll();
    </script>
</body>
</html>`;
}