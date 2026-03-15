export interface AABBBounds {
    min: [number, number, number];
    max: [number, number, number];
}

/**
 * Calculates a centered Axis-Aligned Bounding Box (AABB) 
 * given a position and standard dimensions/scale.
 */
export function getBounds(pos: [number, number, number], scale: [number, number, number]): AABBBounds {
    const [x, y, z] = pos;
    const [w, h, d] = scale;

    return {
        min: [x - w / 2, y - h / 2, z - d / 2],
        max: [x + w / 2, y + h / 2, z + d / 2]
    };
}

/**
 * Checks instantaneous overlap between two AABB bounds.
 * Extremely fast mathematical evaluation replacing 
 * expensive rigid body physics engines (Rapier/Cannon).
 */
export function checkAABBCollision(a: AABBBounds, b: AABBBounds): boolean {
    return (
        a.min[0] < b.max[0] &&
        a.max[0] > b.min[0] &&
        a.min[1] < b.max[1] &&
        a.max[1] > b.min[1] &&
        a.min[2] < b.max[2] &&
        a.max[2] > b.min[2]
    );
}
