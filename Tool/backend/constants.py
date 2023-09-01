import config
from utils import pathjoin

MASTER_SQL_PATH = r'sql_schemas\master.sql'
PVC_SQL_PATH = r'sql_schemas\pvc.sql'

MASTER_DB_PATH = pathjoin(config.DATA_DIR, 'master.db')
PVC_DB_PATH = pathjoin(config.DATA_DIR, 'pvc{}.db')
