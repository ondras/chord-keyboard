$ARGS := --check --platform browser

index.js: *.ts components/*.ts
	deno bundle $(ARGS) -o $@ index.ts

watch:
	deno bundle $(ARGS) --watch -o index.js index.ts
