// Tool definitions for DerChat (following LeChat pattern)
const AVAILABLE_TOOLS = [
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Search the web for current information. Use for news, weather, recent events, prices.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'Search query'
                    }
                },
                required: ['query']
            }
        }
    }
];

// Tool implementations
const TOOL_IMPLEMENTATIONS = {
    web_search: async (args) => {
        try {
            // Try local proxy first (LeChat server), fallback to public SearXNG
            let response;
            
            try {
                // Try local proxy (requires LeChat server running at localhost:3000)
                response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(args.query)}`);
            } catch (e) {
                // Fallback to public SearXNG instance
                console.log("Local proxy not available, using public SearXNG");
                response = await fetch(`https://searx.be/search?q=${encodeURIComponent(args.query)}&format=json&language=en`);
            }
            
            if (!response.ok) {
                return JSON.stringify({ error: `Search failed: ${response.status}` });
            }
            
            const data = await response.json();
            
            // Extract top 5 results
            const results = (data.results || []).slice(0, 5).map(r => ({
                title: r.title || 'No title',
                url: r.url || '',
                content: (r.content || '').substring(0, 200) + '...'
            }));
            
            return JSON.stringify({
                query: args.query,
                results: results,
                count: results.length
            });
        } catch (error) {
            return JSON.stringify({ error: `Search error: ${error.message}` });
        }
    }
};

// Export as ES6 module
export { AVAILABLE_TOOLS, TOOL_IMPLEMENTATIONS };
