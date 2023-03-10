[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-c66648af7eb3fe8bc4f294546bfd86ef473780cde1dea487d3c4ff354943c9ae.svg)](https://classroom.github.com/online_ide?assignment_repo_id=9618180&assignment_repo_type=AssignmentRepo)
# Evaluation-SwapNFT

## Setup

1. Clonar el repositorio

2. Complete sus datos:
  * NUMERO DE ESTUDIANTE:  233335
  * NOMBRE DE ESTUDIANTE: Juan Manuel Gallicchio
  * ADDRESS DE SU CUENTA: 0x8fB32163b178984e8f1b204f5527DE8A9D1bEBB8
  * ADDRESS DEL CONTRATO NFTContract:  0x967e9F1155cdFc9dd2dD55ce9391e0aFaeb12724
  * ADDRESS DEL CONTRATO SwapNFT: 0xca2A7D0c13b430B4c0a818332cabd3a4f9b762BE
  * ADDRESS DEL CONTRATO SwapNFT Proxy: 0xfd88121409FdFE37eb0303ea1326A15d6826C0B8

3. Installar hardhat `npm install hardhat --save-dev`

4. Instalar dependencias `npm install`

5. Complete la información del archivo `.env` en el directorio raiz del proyecto. Especialmente los siguientes datos:
  * STUDENT_NUMBER = 
  * STUDENT_ADDRESS = 

6. Configure el archivo `hardhat.config.js` según sus necesidades

## Objetivo

Programar un contrato inteligente que permite algunas de las funcionalidades del estandar ERC-721 para tokens no fungbles y un contrato de intercambio llamado "SwapNFT" donde los tokens generados por contratos de NFT pueden ser intercambiados por otro NFT del mismo u otro contraro.

## Tarea

Implemente los métodos del contrato `NFTContract.sol` ubicado en la carpeta `contracts`. La implementación de cada método deberá cumplir con la descripción asociada, respetando los requerimientos en caso de que se indiquen. Se puede hacer uso de variables y funciones auxiliares pero **deben** ser de visibilidad `private` y/o, en caso de que lo considere, hacer uso de `modifier`.

Implemente los métodos del contrato `SwapNFT.sol` ubicado en la carpeta `contracts`. La implementación de cada método deberá cumplir con la descripción asociada, respetando los requerimientos en caso de que se indiquen. Se puede hacer uso de variables y funciones auxiliares pero **deben** ser de visibilidad `private` y/o, en caso de que lo considere, hacer uso de `modifier`.

Este contrato se solicita implementar utilizando el patron proxy, para lo que se otorga parte del contrato SwapNFT_Proxy.sol, el cual se encuentra incompleto y usted debe agregar los elementos que haga falta para que funcione como proxy. De implementar el contrato como proxy debe cambiar en el archivo end el parametro `WITH_PROXY` de 0 a 1 para que los test se realicen tomando en cuenta el proxy.

Además, debe completar el script de deploy `deploy.js` ubicado en la carpeta scripts y deployar los contratos a la red Goerli. El contrato ERC-721 debe inicializarse con la siguiente información:
  *  name: `TT2 Collection`
  *  symbol: `TT2`
  *  tokenURI: `URL to the collection`

Para ejecutar los test proporcionados en la carpeta test ejecutando el comando: `npx hardhat test`.

## **IMPORTANTE** Push changes to your repo

1. Publicar cambios a su repositorio

`git add .`  
`git commit -m "<<your comments here>>"`  
`git push origin main`  

## Ejemplo de ejecución

1. Se deploya el contrato `NFTContract`
2. Se deploya el contrato `SwapNFT`
3. El usuario Juan ejecuta el método `mint` sobre `NFTContract` y mintea un NFT para su cuenta
4. El usuario Ana ejecuta el método `mint` sobre `NFTContract` y mintea un NFT para su cuenta
5. El usuario Juan autoriza al contrato `SwapNFT` a operar sobre su NFT
6. El usuario Ana autoriza al contrato `SwapNFT` a operar sobre su NFT
7. El usuario Juan llama al método `publishNFT` sobre el contrato `SwapNFT` y publica su NFT para ser intercambiado. El NFT pasa a propiedad del contrato `SwapNFT`
8. El usuario Ana llama al método `swapNFT` sobre el contrato `SwapNFT` e intercambia su NFT por el NFT de Juan.
9. Al final de la ejecución el NFT minteado por Juan está en propiedad de Ana y el NFT minteado por Ana está en propiedad de Juan. El contrato `SwapNFT` no tiene NFT en su poder.