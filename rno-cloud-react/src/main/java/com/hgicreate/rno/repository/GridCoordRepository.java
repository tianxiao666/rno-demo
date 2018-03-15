package com.hgicreate.rno.repository;

import com.hgicreate.rno.domain.GridCoord;
import com.hgicreate.rno.domain.GridData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GridCoordRepository extends JpaRepository<GridCoord, Long> {

    List<GridCoord> findByGridIdInOrderByGridIdAsc(List<Long> gridId);

}
