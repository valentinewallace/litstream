import sys

sys.path.insert(0, '/var/www/html/litstream')
python_home = '/home/ubuntu/deskenv'

activate_this = python_home + '/bin/activate_this.py'
execfile(activate_this, dict(__file__=activate_this))
from invoice_server import app as application
