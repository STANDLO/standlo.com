import tunnel from "tunnel-rat";

// This tunnel allows HTML components (like the Sidebar) to teleport 
// R3F components (like <View>) directly inside the main <Canvas> context.
export const partsTunnel = tunnel();
