/**
 * Universal Coordinate Normalization
 * Ensures that all 3D positions and rotations in the STANDLO ecosystem
 * strictly adhere to a 3-decimal floating-point precision.
 */

export const normalizeCoord = (value: number | string): number => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 0;
    // We use Math.round to avoid standard toFixed string issues and parse back to float
    return Math.round(num * 1000) / 1000;
};

export const normalizeVector3 = (vec: [number, number, number]): [number, number, number] => {
    return [
        normalizeCoord(vec[0]),
        normalizeCoord(vec[1]),
        normalizeCoord(vec[2])
    ];
};
