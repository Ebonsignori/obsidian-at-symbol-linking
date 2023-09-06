export function fileNameNoExtension(path: string): string {
	if (!path) return path;
	return path.split("/")?.pop()?.slice(0, -3) as string;
}
