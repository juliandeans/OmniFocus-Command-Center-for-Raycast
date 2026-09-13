export function taskUrl(id: string): string {
  return `omnifocus:///task/${encodeURIComponent(id)}`;
}

export function projectUrl(id: string): string {
  return taskUrl(id);
}

export function folderUrl(id: string): string {
  return `omnifocus:///folder/${encodeURIComponent(id)}`;
}

export function customPerspectiveUrl(name: string): string {
  return `omnifocus:///perspective/${encodeURIComponent(name)}`;
}
