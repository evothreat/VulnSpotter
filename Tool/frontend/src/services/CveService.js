import axios from "axios";


const severityMap = {
    'Low': 'low',
    'Moderate': 'medium',
    'Important': 'high',
    'Critical': 'critical'
};

class CveService {

    constructor() {
        this.basePath = 'https://access.redhat.com/hydra/rest/securitydata';
    }

    get(id) {
        return axios.get(`${this.basePath}/cve/${id}.json`)
            .then(({data}) => {
                return {
                    id: data.name,
                    severity: severityMap[data.threat_severity],
                    summary: data.bugzilla?.description,
                    description: data.details[0]
                };

            })
            //.catch(() => {});    // we don't care about api-server errors
    }
}

export default new CveService();