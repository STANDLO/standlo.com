import * as React from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useGizmoContext } from '@react-three/drei';
import { Vector3, CanvasTexture } from 'three';

const colors = {
    bg: '#f0f0f0',
    hover: '#999',
    text: 'black',
    stroke: 'black'
};

const defaultFaces = ['Right', 'Left', 'Top', 'Bottom', 'Front', 'Back'];

// Z-up Rotations for each face index (px, nx, py, ny, pz, nz)
const MathPIHalf = Math.PI / 2;
const rotations = [-MathPIHalf, MathPIHalf, Math.PI, 0, 0, 0];

const makePositionVector = (xyz: number[]) => new Vector3(...xyz).multiplyScalar(0.38);

const corners = [
    [1, 1, 1],
    [1, 1, -1],
    [1, -1, 1],
    [1, -1, -1],
    [-1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [-1, -1, -1]
].map(makePositionVector);

const cornerDimensions: [number, number, number] = [0.25, 0.25, 0.25];

const edges = [
    [1, 1, 0],
    [1, 0, 1],
    [1, 0, -1],
    [1, -1, 0],
    [0, 1, 1],
    [0, 1, -1],
    [0, -1, 1],
    [0, -1, -1],
    [-1, 1, 0],
    [-1, 0, 1],
    [-1, 0, -1],
    [-1, -1, 0]
].map(makePositionVector);

const edgeDimensions = edges.map((edge) =>
    edge.toArray().map((axis) => (axis === 0 ? 0.5 : 0.25))
) as [number, number, number][];

interface FaceMaterialProps {
    hover: boolean;
    index: number;
    font?: string;
    faces?: string[];
    color?: string;
    hoverColor?: string;
    textColor?: string;
    strokeColor?: string;
    opacity?: number;
}

const FaceMaterial = ({
    hover,
    index,
    font = '20px Inter var, Arial, sans-serif',
    faces = defaultFaces,
    color = colors.bg,
    hoverColor = colors.hover,
    textColor = colors.text,
    strokeColor = colors.stroke,
    opacity = 1
}: FaceMaterialProps) => {

    const texture = React.useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        if (!context) return new CanvasTexture(canvas);

        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = strokeColor;
        context.lineWidth = 4;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(64, 64);
        context.rotate(rotations[index] || 0);

        context.font = font;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = textColor;

        const faceName = faces[index] ? faces[index].toUpperCase() : '';
        context.fillText(faceName, 0, 0);

        context.restore();

        return new CanvasTexture(canvas);
    }, [index, faces, font, color, textColor, strokeColor]);


    return (
        <meshBasicMaterial
            map={texture}
            attach={`material-${index}`}
            color={hover ? hoverColor : 'white'}
            transparent
            opacity={opacity}
        />
    );
};

const FaceCube = (props: Record<string, unknown>) => {
    const { tweenCamera } = useGizmoContext();
    const [hover, setHover] = React.useState<number | null>(null);

    const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(null);
    };

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.face) tweenCamera(e.face.normal);
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (e.faceIndex != null) setHover(Math.floor(e.faceIndex / 2));
    };

    return (
        <mesh
            onPointerOut={handlePointerOut}
            onPointerMove={handlePointerMove}
            onClick={props.onClick || handleClick}
        >
            {[...Array(6)].map((_, index) => (
                <FaceMaterial
                    key={index}
                    index={index}
                    hover={hover === index}
                    {...props}
                />
            ))}
            <boxGeometry />
        </mesh>
    );
};

const EdgeCube = ({
    onClick,
    dimensions,
    position,
    hoverColor = colors.hover
}: {
    onClick?: (e: ThreeEvent<MouseEvent>) => void;
    dimensions: [number, number, number];
    position: Vector3;
    hoverColor?: string;
} & Record<string, unknown>) => {
    const { tweenCamera } = useGizmoContext();
    const [hover, setHover] = React.useState(false);

    const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(false);
    };

    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHover(true);
    };

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        tweenCamera(position);
    };

    return (
        <mesh
            scale={1.01}
            position={position}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={onClick || handleClick}
        >
            <meshBasicMaterial
                color={hover ? hoverColor : 'white'}
                transparent
                opacity={0.6}
                visible={hover}
            />
            <boxGeometry args={dimensions} />
        </mesh>
    );
};

export const ZUpGizmoViewcube = (props: Record<string, unknown>) => {
    return (
        <group scale={[60, 60, 60]}>
            <FaceCube {...props} />
            {edges.map((edge, index) => (
                <EdgeCube
                    key={index}
                    position={edge}
                    dimensions={edgeDimensions[index]}
                    {...props}
                />
            ))}
            {corners.map((corner, index) => (
                <EdgeCube
                    key={index}
                    position={corner}
                    dimensions={cornerDimensions}
                    {...props}
                />
            ))}
        </group>
    );
};
