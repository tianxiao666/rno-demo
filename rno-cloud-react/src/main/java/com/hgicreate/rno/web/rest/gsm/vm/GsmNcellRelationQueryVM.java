package com.hgicreate.rno.web.rest.gsm.vm;

import lombok.Data;

@Data
public class GsmNcellRelationQueryVM {
    private String cellName;
    private String ncellName;
    private String cellBsc;
    private String ncellBsc;
}
