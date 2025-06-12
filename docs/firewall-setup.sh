#!/bin/bash
# Firewall setup script for Vits-Generator
# Kjør dette scriptet på hver VM med riktige parametere

if [ "$#" -ne 1 ]; then
    echo "Bruk: $0 [frontend|backend|database]"
    exit 1
fi

SERVER_TYPE=$1

echo "Setter opp brannmur for $SERVER_TYPE server..."

# Fjern eksisterende regler
sudo iptables -F
sudo iptables -X

# Tillat loopback
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A OUTPUT -o lo -j ACCEPT

# Tillat etablerte forbindelser
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Tillat SSH (viktig for administrasjon)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

case $SERVER_TYPE in
    frontend)
        echo "Konfigurerer Frontend firewall..."
        # Tillat HTTP/HTTPS fra alle
        sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
        sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
        
        # Tillat utgående til Backend
        sudo iptables -A OUTPUT -d 10.12.91.44 -p tcp --dport 3001 -j ACCEPT
        ;;
        
    backend)
        echo "Konfigurerer Backend firewall..."
        # Tillat kun fra Frontend
        sudo iptables -A INPUT -s 10.12.91.55 -p tcp --dport 3001 -j ACCEPT
        
        # Tillat utgående til MongoDB
        sudo iptables -A OUTPUT -d 10.12.91.66 -p tcp --dport 27017 -j ACCEPT
        
        # Tillat utgående HTTPS (for eksternt API)
        sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
        sudo iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT
        
        # Tillat DNS
        sudo iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
        sudo iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT
        ;;
        
    database)
        echo "Konfigurerer Database firewall..."
        # Tillat kun fra Backend
        sudo iptables -A INPUT -s 10.12.91.44 -p tcp --dport 27017 -j ACCEPT
        ;;
        
    *)
        echo "Ukjent servertype: $SERVER_TYPE"
        exit 1
        ;;
esac

# Blokker alt annet
sudo iptables -A INPUT -j DROP
sudo iptables -A FORWARD -j DROP

# Lagre regler
echo "Lagrer iptables regler..."
sudo apt-get install -y iptables-persistent
sudo netfilter-persistent save

echo "Brannmur konfigurert for $SERVER_TYPE!"
echo ""
echo "Aktive regler:"
sudo iptables -L -n -v

# Installer fail2ban for ekstra beskyttelse
echo ""
echo "Installerer fail2ban..."
sudo apt-get install -y fail2ban

# Konfigurer fail2ban
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

sudo systemctl restart fail2ban
echo "fail2ban installert og konfigurert!" 