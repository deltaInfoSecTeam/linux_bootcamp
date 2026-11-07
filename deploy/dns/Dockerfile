# Minimaler DNS-Server fürs Heimnetz: beantwortet den Bootcamp-Namen lokal
# und leitet alle anderen Anfragen an den Router weiter.
FROM alpine:3.20
RUN apk add --no-cache dnsmasq
EXPOSE 53/udp 53/tcp
ENTRYPOINT ["dnsmasq", "--keep-in-foreground", "--log-facility=-", "--conf-file=/etc/dnsmasq.d/bootcamp.conf"]
