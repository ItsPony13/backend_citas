export async function enviarNotificacion(token, titulo, mensaje) {
  if (!token) {
    console.log("No se pudo enviar push: token vacío");
    return;
  }

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title: titulo,
      body: mensaje,
    }),
  });
}
