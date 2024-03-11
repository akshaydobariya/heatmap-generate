import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as poly2tri from "poly2tri";

const ThreeJSComponent = () => {
  const canvasRef = useRef(null);
  let scene, camera, renderer;

  useEffect(() => {
    // Scene setup
    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(1000, 10));

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, 1, 1, 2000);
    camera.position.setScalar(150);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x666666);
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);

    // Light setup
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.setScalar(100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // Points setup
    const obj2 = [
      { x: 154, y: 0 },
      { x: 140, y: 10 },
      // Add your points here
    ];
    const points3d = obj2.map(
      (point) => new THREE.Vector3(point.x, 0, point.y)
    );
    const geom = new THREE.BufferGeometry().setFromPoints(points3d);
    const cloud = new THREE.Points(
      geom,
      new THREE.PointsMaterial({ color: "yellow", size: 2 })
    );
    scene.add(cloud);

    // Texture setup
    const texture = new THREE.TextureLoader().load(
      "https://i.ibb.co/2k3BbfS/test.png"
    );
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    // Geometry setup
    const geometry = geometryFromTris(getTris(obj2));
    assignUVs(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  const renderCanvas = useCallback(() => {
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
      requestAnimationFrame(renderCanvas);
    }
  }, [renderer, scene, camera]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Functions for triangulation
  const getTris = (vecs, hole) => {
    const contour = vecs.map((point) => new poly2tri.Point(point.x, point.y));
    return new poly2tri.SweepContext(contour).triangulate().getTriangles();
  };

  const geometryFromTris = (tris) => {
    const geo = new THREE.Geometry();
    tris.forEach((tri) => {
      const v1 = new THREE.Vector3(tri.points_[0].x, 0, tri.points_[0].y);
      const v2 = new THREE.Vector3(tri.points_[1].x, 0, tri.points_[1].y);
      const v3 = new THREE.Vector3(tri.points_[2].x, 0, tri.points_[2].y);
      geo.vertices.push(v1, v2, v3);
      const face = new THREE.Face3();
      face.a = geo.vertices.length - 3;
      face.b = geo.vertices.length - 2;
      face.c = geo.vertices.length - 1;
      geo.faces.push(face);
      geo.mergeVertices();
    });
    return geo;
  };

  const assignUVs = (geometry) => {
    if (!geometry.faceVertexUvs[0]) {
      geometry.faceVertexUvs[0] = [];
    }

    const box = new THREE.Box3().setFromPoints(geometry.vertices);
    const boxSize = new THREE.Vector3();
    box.getSize(boxSize);
    geometry.faces.forEach((face) => {
      const v1 = geometry.vertices[face.a];
      const v2 = geometry.vertices[face.b];
      const v3 = geometry.vertices[face.c];
      geometry.faceVertexUvs[0].push([
        new THREE.Vector2(
          (v1.x - box.min.x) / boxSize.x,
          (box.max.z - v1.z) / boxSize.z
        ),
        new THREE.Vector2(
          (v2.x - box.min.x) / boxSize.x,
          (box.max.z - v2.z) / boxSize.z
        ),
        new THREE.Vector2(
          (v3.x - box.min.x) / boxSize.x,
          (box.max.z - v3.z) / boxSize.z
        ),
      ]);
    });
    geometry.uvsNeedUpdate = true;
  };

  return <div ref={canvasRef} />;
};

export default ThreeJSComponent;
