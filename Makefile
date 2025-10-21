index.js: *.ts
	deno bundle --platform browser index.ts > $@
