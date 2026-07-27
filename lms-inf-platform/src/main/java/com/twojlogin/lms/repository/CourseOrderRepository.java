package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseOrder;
import com.twojlogin.lms.entity.CourseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CourseOrderRepository extends JpaRepository<CourseOrder, Long> {

    Optional<CourseOrder> findFirstByUserIdAndCourseIdAndStatusOrderByCreatedAtDesc(
            Long userId,
            Long courseId,
            CourseOrderStatus status
    );

    List<CourseOrder> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<CourseOrder> findAllByOrderByCreatedAtDesc();

    @Query("""
            select distinct courseOrder.course.id
            from CourseOrder courseOrder
            where courseOrder.user.id = :userId
              and courseOrder.status = com.twojlogin.lms.entity.CourseOrderStatus.PENDING
            """)
    List<Long> findPendingCourseIdsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);

    @Modifying
    @Query("update CourseOrder order set order.confirmedBy = null where order.confirmedBy.id = :userId")
    void clearConfirmedBy(@Param("userId") Long userId);
}
