const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
    if (req.url === '/fetchLatestStories' && req.method === 'GET') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        const timeRequest = https.get('https://time.com', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (timeRes) => {
            let htmlData = '';

            timeRes.on('data', (chunk) => {
                htmlData += chunk;
            });

            timeRes.on('end', () => {
                try {
                    const articleList = [];
                    const pageContent = htmlData.match(/<div class="partial latest-stories"[\s\S]*?<ul>([\s\S]*?)<\/ul>/);
                    
                    if (pageContent && pageContent[1]) {
                        const storyItems = pageContent[1].match(/<li[\s\S]*?<\/li>/g);
                        
                        if (storyItems) {
                            for (let i = 0; i < Math.min(6, storyItems.length); i++) {
                                const story = storyItems[i];
                                const titleMatch = story.match(/<h3[^>]*>(.*?)<\/h3>/);
                                const linkMatch = story.match(/href="([^"]+)"/);
                                
                                if (titleMatch && titleMatch[1] && linkMatch && linkMatch[1]) {
                                    const title = titleMatch[1].replace(/&#8216;/g, "'")
                                                              .replace(/&#8217;/g, "'")
                                                              .replace(/&#8220;/g, '"')
                                                              .replace(/&#8221;/g, '"')
                                                              .replace(/&amp;/g, '&')
                                                              .trim();
                                                             
                                    const link = linkMatch[1].startsWith('http') ? 
                                               linkMatch[1] : 
                                               `https://time.com${linkMatch[1]}`;
                                               
                                    articleList.push({ title, link });
                                }
                            }
                        }
                    }

                    if (articleList.length > 0) {
                        res.writeHead(200);
                        res.end(JSON.stringify(articleList, null, 2));
                    } else {
                        res.writeHead(500);
                        res.end(JSON.stringify({ error: 'No articles found' }));
                    }
                } catch (error) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Failed to parse Time.com content' }));
                }
            });
        });

        timeRequest.on('error', (error) => {
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to fetch from Time.com' }));
        });

    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Access latest stories at: http://localhost:${PORT}/fetchLatestStories`);
    console.log(`Developed by Madhav Gupta`);
});
