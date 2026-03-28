Necesito una app en nextjs que tenga en la url /[marca]/[id-campaña]/[id-desafio] una experiencia en realidad aumentada.

En esta experiencia primero va a haber un texto descriptivo de la campaña y el premio. Luego el texto breve explicando el desafio. Va a haber un checkbox de "acepto terminos y condiciones" con la opcion de clickear en los terminos y leerlos detenidamente. Finalmente un boton de Empezar.

Luego aparecera la camara y empezara la experiencia. Utilizar mediapipe y puede ser Face, Pose o Hand tracking. Dentro del page.tsx solamente va a tener la configuracion de la experiencia (el tipo de tracking y marca, descripcion, etc de la campaña) el resto de la logica e interfaz deben ser scripts y componentes aparte.

Para cada modo de tracking necesito un conjunto de elementos 3D que haga de mascara (un ovoide para la cabeza, cilindros para las extremidades y prismas para el torso o la palma de La mano).

La parte de renderizado por encima del video usa three js, y la parte de deteccion de landmarks usa mediapipe. Para cada tipo de tracking, crea un Group de three js donde, desde el page.tsx de la campaña pueda agregar objetos 3D y que se mantengan fijos a la cara/cuerpo/manos del usuario. 

todos los datos de la campaña incluyendo el modo de tracking que esten hardcodeados desde un objeto, para despues poder reemplazarlo por una api muy facil.
en cuanto a la identidad usemos colores blanco y negro.