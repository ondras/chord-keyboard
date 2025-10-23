index.js: *.ts components/*.ts
	deno bundle --check --platform browser index.ts > $@
