// Initialize the graph and store references
let svg, g, node, link, zoom;

// Add at the top with other global variables
let simulation;
let currentSection = null;
let scrollProgress = 0;

// Initialize the graph for the project page
function initProjectGraph() {
    const container = document.querySelector('.graph-section .graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create tooltip
    const tooltip = d3.select("body").selectAll(".tooltip").data([0]).join("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Initialize the SVG with the correct dimensions
    svg = d3.select('.graph-section svg')
        .attr("viewBox", [0, 0, width, height]);

    // Create a group for zoom
    g = svg.append("g");

    // Add zoom behavior
    zoom = d3.zoom()
        .scaleExtent([0.2, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoom);

    // Center the initial view
    const initialTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1);
    svg.call(zoom.transform, initialTransform);

    // Load and create the graph
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

        // Create the visualization
        link = g.append("g")
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

        node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", d => `node ${d.type}`);

        const circles = node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", '#6E8DE1')
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
            
            // Check if this word or any of its parts are in tokenizedWords
            const allTokens = Object.values(tokenizedWords).flat();
            const isTokenizedWord = Object.prototype.hasOwnProperty.call(tokenizedWords, d.id) || 
                                  Object.prototype.hasOwnProperty.call(tokenizedWords, d.id.toLowerCase()) ||
                                  allTokens.includes(d.id);  // Check if it's a token itself
            
            tokens.forEach((token, i) => {
                const textTemp = group.append("text")
                    .text(token)
                    .attr("class", "token-text")
                    .attr("visibility", "hidden");
                
                const bbox = textTemp.node().getBBox();
                textTemp.remove();
                
                const padding = 4;
                
                // Add frame for both full words and individual tokens
                if (isTokenizedWord || allTokens.includes(token)) {
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

        // Add hover interactions
        node.on("mouseover", function(event, d) {
            const connectedNodes = new Set();
            links.forEach(link => {
                if (link.source.id === d.id) connectedNodes.add(link.target.id);
                if (link.target.id === d.id) connectedNodes.add(link.source.id);
            });

            node.classed("highlighted", n => {
                const isHighlighted = connectedNodes.has(n.id) || n.id === d.id;
                if (isHighlighted) {
                    d3.select(this).select("circle").attr("fill", '#0DF48C');
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
                .attr("fill", '#6E8DE1');
            
            link.attr("class", "");
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

        setupSimulation(graph.nodes, graph.links, width, height);

        // Initialize scroll observer after graph is ready
        initScrollObserver();
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
}

function initScrollObserver() {
    const scrollSections = document.querySelectorAll('.scroll-section');
    const contentSection = document.querySelector('.content-section');
    
    // Track scroll position for smooth transitions
    contentSection.addEventListener('scroll', () => {
        // Calculate overall scroll progress (0 to 1)
        const scrollMax = contentSection.scrollHeight - contentSection.clientHeight;
        scrollProgress = contentSection.scrollTop / scrollMax;

        // Find current section based on scroll position
        scrollSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionMiddle = rect.top + rect.height / 2;
            const viewportMiddle = window.innerHeight / 2;
            
            // Calculate how centered this section is (0 to 1)
            const distanceFromCenter = Math.abs(sectionMiddle - viewportMiddle);
            const maxDistance = window.innerHeight / 2;
            const centeredness = 1 - Math.min(distanceFromCenter / maxDistance, 1);
            
            if (centeredness > 0) {
                const sectionId = section.dataset.graphHighlight;
                if (currentSection !== sectionId) {
                    currentSection = sectionId;
                    transitionToSection(sectionId, centeredness);
                }
                
                // Update section opacity based on centeredness
                section.style.opacity = 0.3 + (centeredness * 0.7);
                
                // Update graph highlights based on centeredness
                updateGraphHighlights(sectionId, centeredness);
            }
        });
    });
}

function updateGraphHighlights(sectionId, intensity) {
    const highlights = {
        'overview': {
            nodes: ['paris', 'georgetown', 'arc de triomphe', 'stabroek'],
            zoom: { scale: 0.8, x: width/2, y: height/2 },
            description: 'Overview of all connections'
        },
        'tokens': {
            nodes: ['georgetown', 'arc de triomphe'],
            zoom: { scale: 1.5, x: width/2, y: height/2 },
            description: 'Subword tokenization patterns'
        },
        'paris-cluster': {
            nodes: ['paris', 'arc de triomphe', 'olympic', 'paralympic'],
            zoom: { scale: 2, x: width/3, y: height/2 },
            description: 'Olympic connections in Paris'
        },
        'guyana-market': {
            nodes: ['georgetown', 'guyana', 'stabroek', 'market', 'minibus', 'license'],
            zoom: { scale: 2, x: 2*width/3, y: height/2 },
            description: 'Market life in Georgetown'
        },
        'cross-connections': {
            nodes: ['paris', 'georgetown', 'market', 'arc de triomphe'],
            zoom: { scale: 1.2, x: width/2, y: height/2 },
            description: 'Comparing urban spaces'
        }
    };

    const section = highlights[sectionId];
    if (!section) return;

    // Smoothly update node colors and connections
    node.each(function(d) {
        const el = d3.select(this);
        const circle = el.select('circle');
        const isDirectlyHighlighted = section.nodes.some(keyword => 
            d.id.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // Check for connected nodes
        const isConnected = link.filter(l => 
            (l.source.id === d.id && section.nodes.some(keyword => 
                l.target.id.toLowerCase().includes(keyword.toLowerCase()))) ||
            (l.target.id === d.id && section.nodes.some(keyword => 
                l.source.id.toLowerCase().includes(keyword.toLowerCase())))
        ).size() > 0;

        if (isDirectlyHighlighted) {
            // Primary highlighted nodes
            const targetColor = d3.rgb('#0DF48C');
            circle.attr('fill', targetColor);
            el.style('opacity', 0.3 + (intensity * 0.7));
        } else if (isConnected) {
            // Connected nodes get a secondary highlight
            const secondaryColor = d3.rgb('#6E8DE1').brighter(0.5);
            circle.attr('fill', secondaryColor);
            el.style('opacity', 0.3 + (intensity * 0.4));
        } else {
            circle.attr('fill', '#6E8DE1');
            el.style('opacity', 0.2);
        }

        // Highlight tokenized words more prominently
        const isTokenized = tokenizedWords[d.id.toLowerCase()] !== undefined;
        if (sectionId === 'tokens' && isTokenized) {
            circle.attr('fill', '#0DF48C');
            el.style('opacity', 1);
        }
    });

    // Update links with more nuanced highlighting
    link.each(function(d) {
        const el = d3.select(this);
        const sourceHighlighted = section.nodes.some(keyword => 
            d.source.id.toLowerCase().includes(keyword.toLowerCase())
        );
        const targetHighlighted = section.nodes.some(keyword => 
            d.target.id.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (sourceHighlighted && targetHighlighted) {
            // Direct connections between highlighted nodes
            el.style('opacity', intensity)
               .style('stroke', '#0DF48C')
               .style('stroke-width', 2);
        } else if (sourceHighlighted || targetHighlighted) {
            // Secondary connections
            el.style('opacity', 0.3 + (intensity * 0.3))
               .style('stroke', '#6E8DE1')
               .style('stroke-width', 1);
        } else {
            el.style('opacity', 0.1)
               .style('stroke', '#6E8DE1')
               .style('stroke-width', 1);
        }
    });

    // Smooth camera movement with dynamic timing
    if (section.zoom) {
        const currentTransform = d3.zoomTransform(svg.node());
        const targetTransform = d3.zoomIdentity
            .translate(section.zoom.x, section.zoom.y)
            .scale(section.zoom.scale);
        
        svg.transition()
            .duration(1000)
            .ease(d3.easeCubicInOut)
            .call(zoom.transform, targetTransform);
    }
}

// Helper functions for data processing and graph creation
function processData(data) {
    // Your existing data processing code
    // ...
}

function createNodesAndLabels(node) {
    // Your existing node creation code
    // ...
}

function setupSimulation(nodes, links, width, height) {
    simulation = d3.forceSimulation()
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

    // Add window resize handler
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        svg.attr("viewBox", [0, 0, newWidth, newHeight]);
        
        simulation
            .force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
            .force("x", d3.forceX(newWidth / 2).strength(0.05))
            .force("y", d3.forceY(newHeight / 2).strength(0.05))
            .force("radial", d3.forceRadial(d => d.depth * 150, newWidth / 2, newHeight / 2)
                .strength(0.5));
        
        simulation.alpha(0.3).restart();
    });

    simulation
        .nodes(nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(links);

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initProjectGraph);

// Add some CSS transitions for smoother animations
const style = document.createElement('style');
style.textContent = `
    .node {
        transition: opacity 0.5s ease;
    }
    .node circle {
        transition: fill 0.5s ease;
    }
    .links line {
        transition: opacity 0.5s ease, stroke 0.5s ease;
    }
    .scroll-section {
        transition: opacity 0.5s ease;
    }
`;
document.head.appendChild(style); 