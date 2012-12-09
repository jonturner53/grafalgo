IDIR = ../../include
LDIR = ../../lib
LIB = ${LDIR}/lib-ds.a
CXXFLAGS = -Wall -Wno-c++11-extensions -O2 -m64 -I ${IDIR}

OFILES = BstSet.o BalBstSet.o SaBstSet.o DkBstSet.o StairFunc.o \
	 TreeMap.o SaTreeMap.o

.cpp.o:
	${CXX} ${CXXFLAGS} -c $<

BstSet.o : ${IDIR}/stdinc.h ${IDIR}/BstSet.h
BalBstSet.o : ${IDIR}/stdinc.h ${IDIR}/BalBstSet.h
SaBstSet.o :  ${IDIR}/stdinc.h ${IDIR}/SaBstSet.h ${IDIR}/BstSet.h
DkBstSet.o :  ${IDIR}/stdinc.h ${IDIR}/DkBstSet.h \
		 ${IDIR}/SaBstSet.h ${IDIR}/BstSet.h
TreeMap.o :  ${IDIR}/stdinc.h ${IDIR}/TreeMap.h ${IDIR}/BstSet.h
SaTreeMap.o :  ${IDIR}/stdinc.h ${IDIR}/SaTreeMap.h \
		 ${IDIR}/SaBstSet.h ${IDIR}/BstSet.h
StairFunc.o : ${IDIR}/stdinc.h ${IDIR}/StairFunc.h \
		  ${IDIR}/DkBstSet.h ${IDIR}/SaBstSet.h \
	  	  ${IDIR}/BstSet.h

all:	$(OFILES)
	ar -ru ${LIB} $(OFILES)

clean:
	rm -f *.o
