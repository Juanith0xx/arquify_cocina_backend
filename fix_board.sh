#!/bin/bash
sed -i '27,104c\
  useEffect(() => {\
    let currentTexture: THREE.Texture | null = null;\
    let isActive = true;\
\
    if (textureUrl) {\
      const loader = new THREE.TextureLoader();\
      loader.setCrossOrigin("anonymous");\
      loader.load(textureUrl, (tex) => {\
        if (!isActive) {\
          tex.dispose();\
          return;\
        }\
        \
        const clonedTex = tex.clone();\
        clonedTex.wrapS = THREE.MirroredRepeatWrapping;\
        clonedTex.wrapT = THREE.MirroredRepeatWrapping;\
        \
        const img = clonedTex.image;\
        const imgAspect = img && img.width > 0 ? (img.height / img.width) : 1;\
        \
        const realWidthCm = materialType === "hpl" ? 120 : 100;\
        const realHeightCm = realWidthCm * imgAspect;\
        \
        let mapWidth = args[0];\
        let mapHeight = args[1];\
        \
        if (args[2] > args[1] && args[0] > args[1]) {\
           mapWidth = args[0];\
           mapHeight = args[2];\
        }\
        \
        if (args[2] > args[0] && args[1] > args[0]) {\
           mapWidth = args[2];\
           mapHeight = args[1];\
        }\
\
        clonedTex.repeat.set(mapWidth / realWidthCm, mapHeight / realHeightCm);\
        \
        if (materialType === "hpl" && isFrontPanel) {\
          const closetLeftX = -totalWidth / 2;\
          const closetBottomY = 10;\
          const boardLeftX = position[0] - args[0] / 2;\
          const boardBottomY = position[1] - args[1] / 2;\
          const offsetX = (boardLeftX - closetLeftX) / realWidthCm;\
          const offsetY = (boardBottomY - closetBottomY) / realHeightCm;\
          clonedTex.offset.set(offsetX, offsetY);\
        } else if (materialType === "hpl" && mapWidth > mapHeight) {\
           clonedTex.rotation = Math.PI / 2;\
        }\
\
        if (grainDirection === "horizontal") {\
           clonedTex.rotation = Math.PI / 2;\
           clonedTex.center.set(0.5, 0.5);\
           clonedTex.repeat.set(mapHeight / realWidthCm, mapWidth / realHeightCm);\
        }\
\
        clonedTex.needsUpdate = true;\
        \
        setTexture((prev) => {\
          if (prev) prev.dispose();\
          return clonedTex;\
        });\
        currentTexture = clonedTex;\
      });\
    } else {\
      setTexture((prev) => {\
        if (prev) prev.dispose();\
        return null;\
      });\
    }\
\
    return () => {\
      isActive = false;\
      if (currentTexture) currentTexture.dispose();\
    };\
  }, [textureUrl, materialType, args[0], args[1], args[2], position[0], position[1], totalWidth, isFrontPanel, grainDirection]);
' src/components/Board.tsx
