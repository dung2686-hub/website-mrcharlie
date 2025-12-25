class GitHubClient {
    constructor() {
        this.baseUrl = 'https://api.github.com';
        this.token = null;
        this.owner = null;
        this.repo = null;
    }

    setCredentials(token, owner, repo) {
        this.token = token;
        this.owner = owner;
        this.repo = repo;
    }

    async getHeaders() {
        return {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
        };
    }

    async verify() {
        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}`, {
                headers: await this.getHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                return { isValid: true, defaultBranch: data.default_branch };
            }
            return { isValid: false, defaultBranch: null };
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getFile(path) {
        const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
            headers: await this.getHeaders()
        });

        if (!response.ok) throw new Error('Cannot fetch file');

        const data = await response.json();
        // Decode Base64 content (handles UTF-8 correctly)
        const content = decodeURIComponent(escape(atob(data.content)));

        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            alert("⚠️ Cảnh báo: File dữ liệu trên GitHub bị lỗi cú pháp! Vui lòng kiểm tra lại.");
            parsedContent = {}; // Fallback to avoid crash
        }

        return {
            content: parsedContent,
            sha: data.sha
        };
    }

    async updateFile(path, content, sha, message) {
        // Encode to Base64 (handles UTF-8)
        const contentEncoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        const body = {
            message: message,
            content: contentEncoded,
            sha: sha
        };

        const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
            method: 'PUT',
            headers: await this.getHeaders(),
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Update failed');
        }


        return await response.json();
    }

    async uploadFile(file, folder = 'assets/logos') {
        // Read file as base64
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    // Get base64 content (remove data URL prefix)
                    const base64Content = reader.result.split(',')[1];

                    // Generate filename with timestamp to avoid conflicts
                    const timestamp = Date.now();
                    const nameParts = file.name.split('.');
                    const extension = nameParts.pop();
                    const name = nameParts.join('.');
                    // Keep original name + timestamp for uniqueness
                    const filename = `${name}_${timestamp}.${extension}`;
                    const path = `${folder}/${filename}`;

                    // Upload to GitHub
                    const body = {
                        message: `Upload file: ${filename}`,
                        content: base64Content
                    };

                    const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`, {
                        method: 'PUT',
                        headers: await this.getHeaders(),
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.message || 'Upload failed');
                    }

                    const result = await response.json();

                    // Return the raw GitHub URL for binary files to ensure download
                    // Or return relative path. For .exe, relative path on GitHub Pages works but might be cached.
                    // Raw URL is safer for "Download Latest".
                    // But relative is better for domain consistency.
                    // Let's stick to returning relative path, same as before.
                    resolve('/' + path);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
}

const ghClient = new GitHubClient();
