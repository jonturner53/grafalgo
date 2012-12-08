IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -I ${IDIR}

OFILES = BstSet.o BalBstSet.o SaBstSet.o DkBstSet.o StaircaseFunc.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

BstSet.o : ${IDIR}/stdinc.h ${IDIR}/BstSet.h
BalBstSet.o : ${IDIR}/stdinc.h ${IDIR}/BalBstSet.h
SaBstSet.o :  ${IDIR}/stdinc.h ${IDIR}/SaBstSet.h \
		 ${IDIR}/BstSet.h
DkBstSet.o :  ${IDIR}/stdinc.h ${IDIR}/DkBstSet.h \
		 ${IDIR}/SaBstSet.h ${IDIR}/BstSet.h
StaircaseFunc.o : ${IDIR}/stdinc.h ${IDIR}/StaircaseFunc.h \
		  ${IDIR}/DkBstSet.h ${IDIR}/SaBstSet.h \
	  	  ${IDIR}/BstSet.h

all:	$(OFILES)
	ar -ru ${LIB} $(OFILES)

clean:
	rm -f *.o
