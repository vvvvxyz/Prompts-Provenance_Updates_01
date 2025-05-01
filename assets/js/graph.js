// Only initialize if we're on the graph page
if (document.querySelector('.graph-container:not(.graph-section *)')) {
    // Set up the SVG
    const svg = d3.select("svg");
    const container = document.querySelector('.graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    svg.attr("viewBox", [0, 0, width, height]);

    // Add window resize handler
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        svg.attr("viewBox", [0, 0, width, height]);
        simulation.force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(0.05))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("radial", d3.forceRadial(d => d.depth * 150, width / 2, height / 2).strength(0.5));
        reheatSimulation();
    });

    // Create a group for zoom
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.2, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Create a tooltip div
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Color scales for different node types
    const nodeColors = {
        default: '#6E8DE1',    // Non-selected nodes
        selected: '#0DF48C'    // Selected/highlighted nodes
    };

    function getNodeColor(d) {
        return nodeColors.default;  // All nodes start with default color
    }

    // TokenizedWords dictionary
    const tokenizedWords = {
        'arc de triomphe': ['arc', 'de', 'trio', '##mphe'],
        'paris': ['par', '##is'],
        'france': ['fr', '##ance'],
        'olympic': ['oly', '##mpic'],
        'paralympic': ['para', '##ly', '##mpic'],
        'champs-élysées': ['champs', '##-', '##ély', '##sées'],
        'stabroek': ['sta', '##bro', '##ek'],
        'market': ['mar', '##ket'],
        'georgetown': ['george', '##town'],
        'guyana': ['guy', '##ana'],
        'minibus': ['mini', '##bus'],
        'license': ['lic', '##ense'],
        'plate': ['pl', '##ate'],
        'woman': ['wo', '##man'],
        'women': ['wo', '##men'],
        'colorful': ['color', '##ful'],
        'shawl': ['sha', '##wl'],
        'posing': ['pos', '##ing'],
        'front': ['fr', '##ont'],
        'banners': ['ban', '##ners'],
        'visible': ['vis', '##ible'],
        'famous': ['fam', '##ous'],
        'monument': ['monu', '##ment'],
        'standing': ['stand', '##ing'],
        'appears': ['app', '##ears'],
        'distinctive': ['dist', '##inct', '##ive'],
        'structure': ['struct', '##ure'],
        'written': ['writ', '##ten'],
        'iron': ['ir', '##on'],
        'red': ['red'],
        'white': ['wh', '##ite']
    };

    function formatTokenizedText(text) {
        const cleanText = text.trim();
        
        if (tokenizedWords[cleanText]) {
            return tokenizedWords[cleanText];
        }
        
        const lowercaseText = cleanText.toLowerCase();
        if (tokenizedWords[lowercaseText]) {
            return tokenizedWords[lowercaseText];
        }
        
        return [cleanText];
    }

    // Create the force simulation
    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id)
            .distance(d => {
                const sourceType = d.source.type || d.source.type;
                const targetType = d.target.type || d.target.type;
                const sourceDepth = d.source.depth || 0;
                const targetDepth = d.target.depth || 0;
                const depthDiff = Math.abs(sourceDepth - targetDepth);
                
                if ((sourceType === 'parent' && targetType === 'child') ||
                    (sourceType === 'child' && targetType === 'parent')) {
                    return 200 + depthDiff * 100;
                }
                if (sourceType === 'child' && targetType === 'child') {
                    return depthDiff === 0 ? 150 : 300 + depthDiff * 50;
                }
                return 400 + depthDiff * 100;
            })
            .strength(d => {
                const sourceType = d.source.type || d.source.type;
                const targetType = d.target.type || d.target.type;
                const sourceDepth = d.source.depth || 0;
                const targetDepth = d.target.depth || 0;
                const depthDiff = Math.abs(sourceDepth - targetDepth);
                
                if ((sourceType === 'parent' && targetType === 'child') ||
                    (sourceType === 'child' && targetType === 'parent')) {
                    return 0.5 / (depthDiff + 1);
                }
                if (sourceType === 'child' && targetType === 'child') {
                    return depthDiff === 0 ? 0.3 : 0.1;
                }
                return 0.05;
            }))
        .force("charge", d3.forceManyBody()
            .strength(d => {
                const baseStrength = d.type === 'parent' ? -1000 : -500;
                return baseStrength * (1 + d.depth * 0.2);
            })
            .distanceMax(400))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide()
            .radius(d => d.radius * (2 + d.depth * 0.3))
            .strength(0.8))
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("radial", d3.forceRadial(d => d.depth * 150, width / 2, height / 2)
            .strength(0.5))
        .alpha(0.5)
        .alphaDecay(0.02)
        .alphaMin(0.001)
        .velocityDecay(0.4);

    // Load and transform the data
    d3.json("data/network_data-PP.json").then(function(data) {
        const nodes = new Set();
        const nodeData = new Map();
        const links = [];
        
        function collectNodes(item, isParent = false, depth = 0) {
            const cleanWord = item.word.trim();
            nodeData.set(cleanWord, {
                id: cleanWord,
                word: cleanWord,
                type: isParent ? 'parent' : 'child',
                explanation: item.explanation || '',
                childCount: 0,
                depth: depth
            });
            nodes.add(cleanWord);
            
            if (item.associations && item.associations.length > 0) {
                nodeData.get(cleanWord).childCount = item.associations.length;
                item.associations.forEach(assoc => {
                    collectNodes(assoc, false, depth + 1);
                });
            }
        }

        function processAssociations(item) {
            if (item.associations && item.associations.length > 0) {
                item.associations.forEach(assoc => {
                    const sourceNode = nodeData.get(item.word);
                    const targetNode = nodeData.get(assoc.word);
                    if (sourceNode && targetNode) {
                        links.push({
                            source: item.word,
                            target: assoc.word,
                            value: 1,
                            sourceType: sourceNode.type,
                            targetType: targetNode.type
                        });
                    }
                    
                    if (assoc.associations && assoc.associations.length > 0) {
                        processAssociations(assoc);
                    }
                });
            }
        }

        data.associations.forEach(item => collectNodes(item, true));
        data.associations.forEach(item => processAssociations(item));

        const nodesArray = Array.from(nodes).map(word => {
            const nodeInfo = nodeData.get(word);
            const baseRadius = nodeInfo.type === 'parent' ? 8 : 6;
            const connectionBonus = Math.sqrt(nodeInfo.childCount) * (nodeInfo.type === 'parent' ? 0.8 : 0.6);
            return {
                ...nodeInfo,
                radius: baseRadius + connectionBonus
            };
        });

        const graph = {
            nodes: nodesArray,
            links: links
        };

        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("stroke-width", d => {
                if (d.sourceType === 'parent' || d.targetType === 'parent') {
                    return 2;
                }
                return 1;
            });

        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", d => `node ${d.type}`);

        const circles = node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", nodeColors.default)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        const labels = node.append("g")
            .attr("class", "label-group")
            .attr("transform", d => `translate(${d.radius + 2}, 2)`);

        labels.each(function(d) {
            const group = d3.select(this);
            const tokens = formatTokenizedText(d.id);
            let xOffset = 0;
            
            const isTokenizedWord = tokenizedWords[d.id] !== undefined || 
                                  tokenizedWords[d.id.toLowerCase()] !== undefined;
            
            tokens.forEach((token, i) => {
                const textTemp = group.append("text")
                    .text(token)
                    .attr("class", "token-text")
                    .attr("visibility", "hidden");
                
                const bbox = textTemp.node().getBBox();
                textTemp.remove();
                
                const padding = 4;
                
                if (isTokenizedWord) {
                    group.append("rect")
                        .attr("class", "token-frame")
                        .attr("x", xOffset - padding/2)
                        .attr("y", -bbox.height/2 - padding/2)
                        .attr("width", bbox.width + padding)
                        .attr("height", bbox.height + padding);
                }
                
                group.append("text")
                    .attr("class", "token-text")
                    .attr("x", xOffset)
                    .attr("y", 0)
                    .text(token);
                
                xOffset += bbox.width + (isTokenizedWord ? padding + 4 : 2);
            });
        });

        node.on("mouseover", function(event, d) {
            const connectedNodes = new Set();
            links.forEach(link => {
                if (link.source.id === d.id) connectedNodes.add(link.target.id);
                if (link.target.id === d.id) connectedNodes.add(link.source.id);
            });

            node.classed("highlighted", n => {
                const isHighlighted = connectedNodes.has(n.id) || n.id === d.id;
                if (isHighlighted) {
                    d3.select(this).select("circle").attr("fill", nodeColors.selected);
                }
                return isHighlighted;
            })
            .classed("dimmed", n => !connectedNodes.has(n.id) && n.id !== d.id);

            link.attr("class", l => 
                (l.source.id === d.id || l.target.id === d.id) ? "highlighted" : "");

            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>${d.id}</strong>
                ${d.explanation ? `${d.explanation}` : ''}
                ${d.childCount ? `<br/><br/>Connected nodes: ${d.childCount}` : ''}
                <br/><em>${d.type === 'parent' ? 'Main Topic' : 'Related Topic'}</em>
            `);
        })
        .on("mouseout", function(d) {
            node.classed("highlighted", false)
                .classed("dimmed", false)
                .select("circle")
                .attr("fill", nodeColors.default);
            
            link.attr("class", "");
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        }
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        setTimeout(() => {
            d.fx = null;
            d.fy = null;
        }, 1000);
    }

    function reheatSimulation() {
        simulation.alpha(0.3).restart();
    }
} 