IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CXXFLAGS = -O2 -m64 -I ${IDIR}
.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

SortedSets.o : ${IDIR}/stdinc.h ${IDIR}/SortedSets.h
BalancedBsts.o : ${IDIR}/stdinc.h ${IDIR}/BalancedBsts.h
SelfAdjBsts.o :  ${IDIR}/stdinc.h ${IDIR}/SelfAdjBsts.h \
		 ${IDIR}/SortedSets.h
DualKeyBsts.o :  ${IDIR}/stdinc.h ${IDIR}/DualKeyBsts.h \
		 ${IDIR}/SelfAdjBsts.h ${IDIR}/SortedSets.h
StaircaseFunc.o : ${IDIR}/stdinc.h ${IDIR}/StaircaseFunc.h \
		  ${IDIR}/DualKeyBsts.h ${IDIR}/SelfAdjBsts.h \
	  	  ${IDIR}/SortedSets.h

all:	SortedSets.o BalancedBsts.o SelfAdjBsts.o DualKeyBsts.o StaircaseFunc.o
	ar -ru ${LIB} SortedSets.o BalancedBsts.o SelfAdjBsts.o DualKeyBsts.o \
	StaircaseFunc.o
#	make -C dvr IDIR='${IDIR}' LDIR='${LDIR}' BIN='${BIN}' \
#                    CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f *.o
	#make -C dvr clean
